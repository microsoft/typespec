import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;
using Azure.ClientGenerator.Core;

@armProviderNamespace
@service({
  title: "ArmStreamStyleSerialization",
})
@versioned(Versions)
@doc("Arm Resource Provider management API.")
namespace Cadl.ArmStreamStyleSerialization;

@doc("Azure API versions.")
enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Preview API version 2023-12-01-preview.")
  v2023_12_01_preview: "2023-12-01-preview",
}

@doc("This is base model for polymorphic multiple levels inheritance with a discriminator.")
@discriminator("kind")
model Fish {
  age: int32;

  @visibility("read")
  dna: string;

  properties: FishProperties;
  anotherProperties: AnotherFishProperties;
}

@doc("The second level model in polymorphic multiple levels inheritance and it defines a new discriminator.")
@discriminator("sharktype")
model Shark extends Fish {
  kind: "shark";
  sharktype: string;
}

@doc("The second level model in polymorphic multiple levels inheritance which contains references to other polymorphic instances.")
model Salmon extends Fish {
  kind: "salmon";
  friends?: Fish[];
  hate?: Record<Fish>;
  partner?: Fish;
}

model FishProperties {
  tailProperties: TailProperties;
}

model TailProperties {
  length: float32;

  @visibility("read")
  patten: string;

  requiredString: string;
}

model AnotherFishProperties {
  eyeProperties: EyeProperties;
}

model EyeProperties {
  length: float32;

  @visibility("read")
  patten: string;

  requiredString: string;
}

@doc("The third level model SawShark in polymorphic multiple levels inheritance.")
model SawShark extends Shark {
  sharktype: "saw";

  // this is a duplicate property from Fish, with different visibility
  dna: string;

  // this is a duplicate property from Fish, with same visibility
  age: int32;
}

@doc("The third level model GoblinShark in polymorphic multiple levels inheritance.")
model GoblinShark extends Shark {
  sharktype: "goblin";
}

// test Resource as parent
@resource("topLevelArmResources")
model TopLevelArmResource is TrackedResource<TopLevelArmResourceProperties> {
  @key("topLevelArmResourceName")
  @path
  @segment("topLevelArmResources")
  @doc("arm resource name for path")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;
}

@doc("Top Level Arm Resource Properties.")
model TopLevelArmResourceProperties {
  description?: string;
}

@error
model ErrorResponse {
  error: Error;
}

@error
model ErrorResponseMin {
  error: ErrorMin;
}

model Error {
  code: string;
  message: string;
  target: string;
  details?: Error[];
  additionalInfo?: AdditionalInfo[];
  additionalProperty: string;
}

model AdditionalInfo {
  type: string;
  info: {};
}

model ErrorMin {
  code: string;
  message: string;
  additionalProperty: string;
}

@doc("This is base model for polymorphic OutputOnlyModel.")
@discriminator("kind")
model OutputOnlyModel {
  name: string;

  @visibility("read")
  id: string;

  @flattenProperty
  properties: OutputOnlyModelProperties;
}

model OutputOnlyModelProperties {
  title: string;
}

model OutputOnlyModelChild extends OutputOnlyModel {
  kind: "child";
  childName: string;
}

@route("/model")
interface Fishes {
  @get
  getModel(): Fish | ErrorResponse;

  @put
  putModel(@body fish: Fish): Fish | ErrorResponseMin;

  @get
  @route("output")
  getOutputOnlyModel(): OutputOnlyModel;
}

interface TopLevelArmResources {
  update is ArmCustomPatchAsync<TopLevelArmResource>;
}

@@flattenProperty(Fish.properties);
@@flattenProperty(FishProperties.tailProperties);
@@flattenProperty(Fish.anotherProperties);
@@flattenProperty(AnotherFishProperties.eyeProperties);
